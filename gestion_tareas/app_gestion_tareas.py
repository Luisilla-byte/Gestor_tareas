from flask import Flask, request, render_template, redirect, url_for, flash, session, jsonify
from conector_1 import conectar
import os

app = Flask(__name__,
            template_folder=os.path.join(os.path.abspath(os.path.dirname(__file__)), '../plantillas'),
            static_folder=os.path.join(os.path.abspath(os.path.dirname(__file__)), '../estilos'))
app.secret_key = os.urandom(24)

@app.route('/')
def inicio():
    return render_template('inicio_sesion.html')

@app.route('/iniciar_sesion', methods=['POST'])
def iniciar_sesion():
    usuario = request.form['usuario']
    contrasena = request.form['contrasena']

    conexion = conectar()
    if conexion is None:
        return "Error en la conexión a la base de datos", 500

    cursor = conexion.cursor()
    try:
        cursor.execute("SELECT * FROM usuarios_login WHERE usuario=%s AND contrasena=%s", (usuario, contrasena))
        user = cursor.fetchone()
        cursor.fetchall()

        if user:
            session['usuario'] = usuario
            return redirect(url_for('menu'))
        else:
            flash('Usuario o contraseña incorrectos')
            return redirect(url_for('inicio'))
    finally:
        cursor.close()
        conexion.close()

@app.route('/registrarse', methods=['POST'])
def registrarse():
    usuario = request.form.get('usuario')
    correo = request.form.get('correo')
    contrasena = request.form.get('contrasena')

    if not usuario or not correo or not contrasena:
        flash('Por favor, completa todos los campos')
        return redirect(url_for('inicio'))

    conexion = conectar()
    if conexion is None:
        return "Error en la conexión a la base de datos", 500

    cursor = conexion.cursor()
    try:
        cursor.execute("INSERT INTO usuarios_registro (usuario, correo, contrasena) VALUES (%s, %s, %s)", (usuario, correo, contrasena))
        conexion.commit()
    finally:
        cursor.close()
        conexion.close()

    conexion = conectar()
    if conexion is None:
        return "Error en la conexión a la base de datos", 500

    cursor = conexion.cursor()
    try:
        cursor.execute("INSERT INTO usuarios_login (usuario, contrasena) VALUES (%s, %s)", (usuario, contrasena))
        conexion.commit()

        session['usuario'] = usuario
        return redirect(url_for('menu'))
    finally:
        cursor.close()
        conexion.close()

@app.route('/menu')
def menu():
    if 'usuario' not in session:
        return redirect(url_for('inicio'))
    return render_template('menu.html')

@app.route('/dashboard')
def dashboard():
    if 'usuario' in session:
        return f'Bienvenido {session["usuario"]}'
    else:
        return redirect(url_for('inicio'))

@app.route('/tasks', methods=['GET'])
def get_tasks():
    if 'usuario' not in session:
        return redirect(url_for('inicio'))

    usuario = session['usuario']
    conexion = conectar()
    if conexion is None:
        return "Error en la conexión a la base de datos", 500

    cursor = conexion.cursor()
    try:
        cursor.execute("SELECT * FROM tareas WHERE usuario = %s", (usuario,))
        tasks = cursor.fetchall()
        tasks_list = []
        for task in tasks:
            tasks_list.append({
                'id': task[0],  
                'title': task[1],
                'description': task[2],
                'status': task[3],
                'date': task[4]  # Se Ajustan estos índices al esquema de base de datos
            })
        return jsonify(tasks_list)  # Convierte las tareas a JSON
    finally:
        cursor.close()
        conexion.close()

@app.route('/tasks', methods=['POST'])
def create_task():
    if 'usuario' not in session:
        return redirect(url_for('inicio'))

    usuario = session['usuario']
    title = request.json.get('title')
    description = request.json.get('description')
    status = request.json.get('status', 'completada')
    date = request.json.get('date')  # Obtener la fecha del JSON

    if not title or not description:
        return jsonify({'error': 'Título y descripción son obligatorios'}), 400

    conexion = conectar()
    if conexion is None:
        return "Error en la conexión a la base de datos", 500

    cursor = conexion.cursor()
    try:
        cursor.execute("INSERT INTO tareas (title, description, status, usuario, date) VALUES (%s, %s, %s, %s, %s)",
                       (title, description, status, usuario, date))
        conexion.commit()
        print(f'Tarea agregada: {title}, {description}, {status}, {date}')  # Depuración
        return jsonify({'message': 'Tarea creada exitosamente'}), 201
    finally:
        cursor.close()
        conexion.close()

@app.route('/tasks/<int:id>', methods=['PUT'])
def update_task(id):
    if 'usuario' not in session:
        return redirect(url_for('inicio'))

    usuario = session['usuario']
    title = request.json.get('title')
    description = request.json.get('description')
    status = request.json.get('status')

    if status not in ['Completada', 'Pendiente']:
        return jsonify({'error': 'Estado inválido. Debe ser "Completada" o "Pendiente".'}), 400

    conexion = conectar()
    if conexion is None:
        return "Error en la conexión a la base de datos", 500

    cursor = conexion.cursor()
    try:
        cursor.execute(
            "UPDATE tareas SET title = %s, description = %s, status = %s WHERE id = %s AND usuario = %s",
            (title, description, status, id, usuario)
        )
        conexion.commit()
        return jsonify({'message': 'Tarea actualizada exitosamente'})
    finally:
        cursor.close()
        conexion.close()


@app.route('/tasks/<int:id>', methods=['DELETE'])
def delete_task(id):
    if 'usuario' not in session:
        return redirect(url_for('inicio'))

    usuario = session['usuario']
    conexion = conectar()
    if conexion is None:
        return "Error en la conexión a la base de datos", 500

    cursor = conexion.cursor()
    try:
        cursor.execute("DELETE FROM tareas WHERE id = %s AND usuario = %s", (id, usuario))
        conexion.commit()
        return jsonify({'message': 'Tarea eliminada exitosamente'})
    finally:
        cursor.close()
        conexion.close()

if __name__ == '__main__':
    app.run(debug=True)