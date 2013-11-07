import os.path, requests
import tornado.httpserver, tornado.ioloop, tornado.web, tornado.auth

from sqlalchemy.exc import SQLAlchemyError

from configuration import currentConfig, configDict
from tornado.options import define, options
from tornado.escape import json_encode, json_decode
from tornado.web import HTTPError
from tornado.template import Template

from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from models import *

from views.base import BaseHandler, admin_only

class ViewIndexHandler(BaseHandler):
    def get(self):
        self.render("index.html", fb_api_key=currentConfig.fb_api_key)

