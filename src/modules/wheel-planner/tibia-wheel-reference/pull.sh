#!/usr/bin/env sh

# This file is part of Tibia Wheel.
# Copyright (c) 2022 Maciej Sopyło
# 
# Tibia Wheel is free software: you can redistribute it and/or modify  
# it under the terms of the GNU Lesser General Public License as published by  
# the Free Software Foundation, version 3.
#
# Tibia Wheel is distributed in the hope that it will be useful, but 
# WITHOUT ANY WARRANTY; without even the implied warranty of 
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU 
# General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public License 
# along with this program. If not, see <http://www.gnu.org/licenses/>.

rm -rf ./.tmp
mkdir -p ./.tmp

if [ ! -f ./rccextended/src/rcc ]; then
  cd ./rccextended/src
  qmake rcc.pro
  make
  cd ..
fi

cd .tmp

wget https://static.test.tibia.com/launcher/tibiaclient-linux-current/bin/graphics_resources.rcc.lzma
../decompress.py graphics_resources.rcc.lzma graphics_resources.rcc

../rccextended/src/rcc --reverse

rm -rf ./assets/skillwheel
rm -rf ./assets/*.png
cp ./qresource/res/graphics_resources.rcc/images/background.png ../assets/
cp ./qresource/res/graphics_resources.rcc/images/background-dark.png ../assets/
cp ./qresource/res/graphics_resources.rcc/images/skin/classic/button-9grid-idle.png ../assets/
cp ./qresource/res/graphics_resources.rcc/images/skin/classic/button-9grid-pressed.png ../assets/
cp ./qresource/res/graphics_resources.rcc/images/widget-borderimage.png ../assets/
cp -r ./qresource/res/graphics_resources.rcc/images/skillwheel ../assets/
