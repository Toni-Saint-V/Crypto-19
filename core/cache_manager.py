import json
import os
import time
CACHE_DIR = "cache"
os.makedirs(CACHE_DIR, exist_ok=True)

def save_cache(name, data):
    path = os.path.join(CACHE_DIR, f"{name}.json")
    with open(path, "w") as f:
        json.dump({"timestamp": time.time(), "data": data}, f)

def load_cache(name, max_age=30):
    path = os.path.join(CACHE_DIR, f"{name}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r") as f:
        payload = json.load(f)
    if time.time() - payload["timestamp"] > max_age:
        return None
    return payload["data"]
