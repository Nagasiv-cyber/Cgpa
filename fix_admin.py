import asyncio
from backend.database import get_database, connect_to_mongo, close_mongo_connection
from backend.auth_utils import hash_password

async def main():
    await connect_to_mongo()
    db = get_database()
    
    # Hash the password
    hashed = hash_password('12345')
    
    # Update the admin user
    result = await db.users.update_one(
        {"email": "admin@aiml.edu"},
        {
            "$set": {"password": hashed},
            "$unset": {"hashed_password": ""}
        }
    )
    print(f"Updated user: {result.modified_count} docs modified.")
    
    await close_mongo_connection()

if __name__ == '__main__':
    asyncio.run(main())
