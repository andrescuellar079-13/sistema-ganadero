import psycopg2

print("Intentando conectar a PostgreSQL...")

try:
    conn = psycopg2.connect(
        dbname="sistema ganadero",
        user="postgres",
        password="123456",
        host="127.0.0.1",
        port="5432"
    )
    print("✅ CONEXIÓN EXITOSA!")
    conn.close()
except Exception as e:
    print(f"❌ ERROR: {e}")