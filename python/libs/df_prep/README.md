#### Build

```
python setup.py sdist bdist_wheel
```

#### Publish

```
twine upload dist/* -u __token__ -p [token]                                                                                                        
```