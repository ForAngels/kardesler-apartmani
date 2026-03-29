import socket
import psycopg2

regions = [
    'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 
    'eu-south-1', 'eu-north-1',
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
]

password = "Onurcan27121999"
user = "postgres.hjvqlomveqcaxsjpjkyf"

for r in regions:
    host = f"aws-0-{r}.pooler.supabase.com"
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=user,
            password=password,
            host=host,
            port="6543",
            connect_timeout=3
        )
        print(f"SUCCESS region is: {r}")
        conn.close()
        break
    except Exception as e:
        print(f"Failed {r}: {e}")
