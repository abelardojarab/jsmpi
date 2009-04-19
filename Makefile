# Common flags
CC := gcc
MPICC := mpiCC
LDFLAGS :=

# Plug-in flags
PLIBS := -lv8 -lpthread 
PFLAGS := -shared -m32

# Plugin-sources
PLUGSRC := $(wildcard plugin/*.cc)
PLUGOBJ := $(subst plugin/, lib/lib, $(PLUGSRC:.cc=.so))
JSPLUGSRC := $(wildcard plugin/*.js)
JSPLUGOBJ := $(subst plugin/, lib/lib, $(JSPLUGSRC:.js=.so))

# Executable flags
CLIBS := -lv8 -lpthread -ldl
CFLAGS := -c -Wall -m32 

# Executable sources
SOURCES := $(wildcard src/*.cc)
OBJECTS := $(SOURCES:.cc=.o)

all: script $(PLUGOBJ) $(JSPLUGOBJ)

# Build script
$(JSPLUGOBJ): script $(JSPLUGSRC) lib/libcpp.so
	./script $(subst lib/lib, plugin/, $(@:.so=.js));

script: $(OBJECTS)
	$(MPICC) $(OBJECTS) $(CLIBS) -o script -m32

# Compile plug-ins
$(PLUGOBJ): $(PLUGSRC)
	$(CC) $(PFLAGS) -o $@ $(subst lib/lib, plugin/, $(@:.so=.cc));

# Compile objects
$(OBJECTS): $(SOURCES)
	$(CC) $(CFLAGS) -o $@ $(@:.o=.cc)

clean: 
	rm script $(OBJECTS) $(PLUGOBJ) $(JSPLUGOBJ) jsMPI.log cache/* *.data *.txt
