import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

import copy
from django.template.context import BaseContext, Context

print("Testing BaseContext.__copy__")
ctx = Context({"a": 1})

def patched_copy(self):
    duplicate = object.__new__(self.__class__)
    duplicate.__dict__.update(self.__dict__)
    duplicate.dicts = self.dicts[:]
    return duplicate

BaseContext.__copy__ = patched_copy

try:
    ctx_copy = copy.copy(ctx)
    print("Patched copy SUCCESS!")
    print(ctx_copy.dicts)
except Exception as e:
    print(f"Patched copy FAILED: {type(e)} - {e}")
