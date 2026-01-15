### Pasos seguidos para la prueba

1-	Crear entorno virtual, en mi caso no lo tengo instalado de manera global, así que tomé un intérprete de otro ambiente para crear este limpio 

```
& "C:\Users\stive\Documents\ICC\projects\2025\db_migrate_env\Scripts\python.exe" -m venv env
``` 

2- Activar el ambiente para el backend
```
cd env/scripts/
```
y
```
./activate
```

3-	Crear backend
```
Crear carpeta  
mkdir backend
Instalar fast api

pip install fastapi uvicorn
```

4- crear frontend

```
npm install -g @angular/cli

ng new conservar-paga --directory=. --routing=true --style=css --skip-git=true
```

se usa el mapa de OSM que no requiere api key para cargar los tiles

## Pasos para inicializar la aplicación

### 1- iniciar el backend

En este escenario subí el ambiente virtual completo al repo (no es buena práctica, pero por cuestión de tiempo lo preferí de esa forma), por tanto, ya está todo listo para correr. Solo se requieren 2 pasos:


1- activar el env

```
/env/Scripts/activate
```

y luego en la carpeta backend

```
uvicorn app.main:app --reload
```

se abrirá en el puerto 8000

### 2- iniciar el frontend

ir a la carpeta del frontend

```
cd frontend
```

y correr npm start 

```
npm start
```

de nuevo, por tema de tiempo dejo el node_modules (no es buena práctica igual), pero ya se puede correr

no obstante, se puede hacer

```
npm install
```

para asegurarse


**Nota** 


### Decisiones técnicas relevantes

Se toma la determinación de cargar en memoria en un gdf para facilidad de carga de los datos y operaciones como la intersección espacial.

La estructura del backend sigue una organización en carpetas que se basa en separar las rutas del principal.

Por otra parte, por tema de tiempo no alcance a realizar las busquedas por bounding box, preferi asegurar el correcto funcionamiento de las partes iniciales.

Se realizó el endpoint para las intersecciones, pero no se integro al frontend, de cierta manera me bloquee y no logre ver en que parte del UX/UI podria ser util ,capaz que un simple boton de : mostrar intersecciones hubiera sido suficiente, pero no lo vi con claridad



### Supuestos realizados

Se asumieron algunas categorias que podrían estar relacionadas para los datos
Se asume que no se requiere una autenticación de ningún tipo

### Mejoras futuras

1- Separar la lógica del negocio (casos de uso, o controladores, podrían llamarse) de las rutas para reutilizar distintas partes de la aplicación
2- poner autenticación para asegurar que los datos solo se consuman de donde queremos (puede ser un api-key o algo que no necesariamente implique un usuario/contraseña), pero también al escalar la aplicacion es posible realizar autenticación tipo JWT o oauth si se usa un arcgis enterprise por detras
3- se podría modular mucho más la app, en este caso realzio una sola página, casi que tipo dashboard, pero 
4- se podría poner mayor interactividad entre los elementos
5- Poner las busquedas por bounding box
6- hay un bug conocido, y es que si se cargan los datos en el frontend, y se realiza un reinicio del backend, al estar guardado en memoria, se reinicia. En este escenario, el frontend sigue renderizando, pero al realizar cambio de filtros o de estadisticas falla, ya que el backend no encuentra los datos. Evidentemente una mejora sería mostrar algo mas de mensajes o algo
7- finalizando la entrega encontre otro bug conocido, y es en los filtros, se esta resaltando o sobre escribiendo, pero no se esta eliminando lo demás que no corresponde a ese filtro, se puede notar al hacer zoom en los features que el frontend si filtra, pero tiene este problema de UX/UI
8- Paginado en los endpoints correspondientes, limite de subida de archivo, creación de un global trycatch para reutilizar y modularizar mejor el código
