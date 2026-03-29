import time
import requests

while True:
    try:
        requests.get("https://alessandra-gluteal-rowena.ngrok-free.dev")
        print("Pinged server")
    except:
        print("Server down")
    time.sleep(300)  # every 5 mins