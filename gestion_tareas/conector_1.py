import mysql.connector
def conectar():
    try:
        conexion = mysql.connector.connect(
            user='root',
            password='Luisa/Fer/1253',
            host='localhost',
            database='gestion_tareas',
            port='3306'
        )
        print("Conexion exitosa a bd_registro")
        return conexion
    except mysql.connector.Error as err:
        print(f"Error en la conexión a la Base de datos bd_registro: {err}")
        return None