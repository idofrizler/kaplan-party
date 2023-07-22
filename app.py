from flask import Flask, request, make_response, jsonify
from pymongo import MongoClient
from datetime import datetime, timedelta, date
import random, math

app = Flask(__name__)
client = MongoClient('mongodb://localhost:27017/')
db = client['location_db']

def randomize_coordinates(record):
    # Randomize coordinates within 0.5km (assuming Earth is a sphere with radius 6371km)
    dlat = random.uniform(-0.0072, 0.0072)  # ~0.5km in latitude
    dlon = random.uniform(-0.0072, 0.0072) / math.cos(math.radians(record['latitude']))  # ~0.5km in longitude
    record['latitude'] += dlat
    record['longitude'] += dlon
    return record

@app.route('/', methods=['GET'])
def index():
    return app.send_static_file('index.html')

@app.route('/share_location', methods=['POST'])
def share_location():
    data = request.get_json()
    lat = data["latitude"]
    lon = data["longitude"]
    ip = request.remote_addr
    user_agent = request.user_agent.string
    existing_cookie = request.cookies.get('shared_location')

    if existing_cookie == str(datetime.now().date()):
        app.logger.info('Location already shared today')
        return "Location already shared today", 200

    if ip and lat and lon and user_agent:
        record = request.json
        # Convert latitude/longitude to GeoJSON format
        record["location"] = {
            "type": "Point",
            "coordinates": [record["longitude"], record["latitude"]]
        }
        record["ip_address"] = request.remote_addr
        record["timestamp"] = datetime.utcnow()
        record["user_agent"] = user_agent

        if app.debug:
            record = randomize_coordinates(record)

        app.logger.info('Inserting record: %s', str(record))
        db.locations.insert_one(record)

        response = make_response(("Location recorded", 200))
        response.set_cookie('shared_location', str(datetime.now().date()), max_age=60*60*24)  # expires in 1 day
        return response

    return "Failure", 400

@app.route('/view_data', methods=['GET'])
def view_data():
    return app.send_static_file('view_data.html')

@app.route("/get_data", methods=['POST'])
def get_data():
    data = request.json
    date = datetime.strptime(data['date'], '%Y-%m-%d')
    next_day = date + timedelta(days=1)
    
    radius_in_km = 1
    earth_radius_in_km = 6371
    radius_in_radians = radius_in_km / earth_radius_in_km
    
    query = {
        "timestamp": {"$gte": date, "$lt": next_day},
        "location": {
            "$geoWithin": {
                "$centerSphere": [[data["longitude"], data["latitude"]], radius_in_radians]
            }
        }
    }

    count = db.locations.count_documents(query)
    return jsonify({"count": count}), 200

@app.route("/get_location_data", methods=['POST'])
def get_location_data():
    data = request.json
    date = datetime.strptime(data['date'], '%Y-%m-%d')
    next_day = date + timedelta(days=1)
    
    radius_in_km = 1
    earth_radius_in_km = 6371
    radius_in_radians = radius_in_km / earth_radius_in_km
    
    query = {
        "timestamp": {"$gte": date, "$lt": next_day},
        "location": {
            "$geoWithin": {
                "$centerSphere": [[data["longitude"], data["latitude"]], radius_in_radians]
            }
        }
    }

    cursor = db.locations.find(query)
    locations = [doc['location'] for doc in cursor]
    return jsonify({"locations": locations}), 200

if __name__ == "__main__":
    app.run(port=3000)
