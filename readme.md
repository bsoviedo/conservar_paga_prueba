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


