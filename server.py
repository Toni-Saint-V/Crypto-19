from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi import Request

app = FastAPI()

app.mount('/static', StaticFiles(directory='web/static'), name='static')
templates = Jinja2Templates(directory='web/templates')

@app.get('/', response_class=HTMLResponse)
async def ui_root(req: Request):
    return templates.TemplateResponse('index.html', {"request": req})


@app.get("/chart.html", response_class=HTMLResponse)
async def ui_chart_alias(req: Request):
    return templates.TemplateResponse("index.html", {"request": req})
