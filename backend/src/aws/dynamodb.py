import os
import boto3

AWS_REGION = os.getenv("AWS_REGION", "us-east-2")
DDB_PROFILES_TABLE = os.getenv("DDB_PROFILES_TABLE", "kcalapp_profiles")
DDB_DAILY_LOGS_TABLE = os.getenv("DDB_DAILY_LOGS_TABLE", "kcalapp_daily_logs")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)

profiles_table = dynamodb.Table(DDB_PROFILES_TABLE)
daily_logs_table = dynamodb.Table(DDB_DAILY_LOGS_TABLE)


def get_profile_item(user_id: str) -> dict | None:
    response = profiles_table.get_item(Key={"userID": user_id})
    return response.get("Item")


def put_profile_item(item: dict) -> dict:
    profiles_table.put_item(Item=item)
    return item
