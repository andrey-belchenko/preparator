#### Build

```
python setup.py clean --all next sdist bdist_wheel

clean --all почему то не работает
```

#### Publish

```
twine upload dist/* -u __token__ -p [token]                                                                                                        
```

Google Authenticator


pipreqs . 
pip freeze > requirements.txt     