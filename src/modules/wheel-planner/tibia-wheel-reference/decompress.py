#!/usr/bin/env python3

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

# taken from https://github.com/DiegoRibeiro/d_sprite_dump_1200 and modified to accept arguments

import sys
import lzma

def decompress(name, data):
  out = lzma.decompress(data, lzma.FORMAT_AUTO, None)
  with open(name, "wb") as orig:
    orig.write(out)

def fix_header(filepath):
  with open(filepath, 'rb') as f:
    data = bytearray(f.read())
    data = data[32:]
    data[5] = 255
    data[6] = 255
    data[7] = 255
    data[8] = 255
    data[9] = 255
    data[10] = 255
    data[11] = 255
    data[12] = 255
    return data

filename = sys.argv[1]
decompress(sys.argv[2], fix_header(filename))
