#!/bin/bash

script_directory='.'

# Так как многие сопоставления базируются на сопоставленных Подстанциях,
# их сопоставление нужно провести в первую очередь
echo Запуск Substation.py 
python3 Substation.py
echo '-----'
echo Запуск VoltageLevel.py 
python3 VoltageLevel.py
echo '-----'

for script in "$script_directory"/*.py; do
  script_name=$(basename "$script")
  
  # Проверяем, нужно ли исключить файл
  if [[ $script_name == "data_io.py" || $script_name == "Substation.py" || $script_name == "merge.py" || $script_name == "VoltageLevel.py" ]]; then
    continue
  fi
  
  # Запускаем скрипт, если он не был исключен
  echo Запуск $script_name
  python3 "$script"
  echo '-----'
done

echo 'все скрипты сопоставления отработаны'
