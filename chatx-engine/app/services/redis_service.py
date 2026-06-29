import os
import redis
from dotenv import load_dotenv
load_dotenv()

# Construct your URL: redis://default:password@endpoint:port
# It is best practice to store the URL in an environment variable

# Initialize the connection
redis_url = os.getenv("REDIS_URL")
redis_client = redis.from_url(redis_url, decode_responses=True)

# Test the connection
try:
    redis_client.ping()
    print("Successfully connected to Redis!")
except redis.ConnectionError:
    print("Could not connect to Redis.")
