### Pasos seguidos para la prueba

1-	Crear entorno virtual, en mi caso no lo tengo instalado de manera global, así que tome un interprete de otro ambiente para crear este limpio 

'''
& "C:\Users\stive\Documents\ICC\projects\2025\db_migrate_env\Scripts\python.exe" -m venv env
''' 

2- Activar el ambiente para el backend
'''
Cd env/scripts/
'''
y
'''
./actívate
'''

3-	Crear backend
'''
Crear carpeta  
mkdir backend
Instalar fast api

pip install fastapi uvicorn
'''

4- crear frontend

'''
npm install -g @angular/cli

ng new conservar-paga --directory=. --routing=true --style=css --skip-git=true
'''

se usa el mapa de OSM que no requiere api key para cargar los tiles

## Pasos para inicializar la apliación

### 1- iniciar el backend

En este escenario subi el ambiente virtual completo al repo (no es buena práctica, pero por cuestión de tiempo lo preferí de esa forma), por tanto, ya esta todo listo para correr. Solo se requieren 2 pasos:


1- activar el env

'''
/env/Scripts/activate
'''

y luego en la carpeta backend

'''
uvicorn app.main:app --reload
'''

se abrira en el puerto 8000

### 2- iniciar el frontend

ir a la carpeta del frontend

'''
cd frontend
'''

y correr npm start 

'''
npm start
'''

de nuevo, por tema de tiempo dejo el node_modules (no es buena práctiva igual), pero ya se puede correr

no obstante, se puede hacer

'''
npm install
'''

para asegurarse