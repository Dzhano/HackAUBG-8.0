import requests
import json

API_KEY = "8EdZAw7Pr6qSvZ5dZQNtUZy7aWgK33Iu"  # Replace with your TomTom API key
BBOX = "23.0,42.5,23.5,42.8"  # Sofia area (smaller bbox for testing)

url = "https://api.tomtom.com/traffic/services/5/incidentDetails"
params = {
    "key": API_KEY,
    "bbox": BBOX,
    "fields": "{incidents{type,geometry{type,coordinates},properties{iconCategory,from,to,roadNumbers,delay,events{description,code}}}}",
    "language": "en-GB",
    "timeValidityFilter": "present"
}

print(f"Fetching traffic incidents for bbox: {BBOX}")
response = requests.get(url, params=params)

if response.status_code != 200:
    print(f"Error: {response.status_code}")
    print(response.text)
    exit(1)

data = response.json()
incidents = data.get("incidents", [])

print(f"\nFound {len(incidents)} incidents:\n")

for i, incident in enumerate(incidents[:10]):  # Show first 10
    props = incident.get("properties", {})
    geom = incident.get("geometry", {})

    icon_categories = {
        0: "Unknown", 1: "Accident", 2: "Fog", 3: "Dangerous",
        6: "Road Closed", 7: "Road Works", 9: "Congestion", 14: "Broken Vehicle"
    }

    category = icon_categories.get(props.get("iconCategory"), "Other")
    from_road = props.get("from", "?")
    to_road = props.get("to", "?")
    events = props.get("events", [{}])
    description = events[0].get("description", "No description") if events else "No description"
    coords = geom.get("coordinates", [])[:2] if geom.get("coordinates") else []

    print(f"{i+1}. [{category}] {from_road} -> {to_road}")
    print(f"   {description}")
    if coords:
        print(f"   Coords: {coords}")
    print()

# Save full response
with open("tomtom-response.json", "w") as f:
    json.dump(data, f, indent=2)
print("Full response saved to tomtom-response.json")