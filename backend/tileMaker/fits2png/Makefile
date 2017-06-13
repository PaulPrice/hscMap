GCC_DIR := /usr
SFITSIO_DIR := $(HOME)/hscMap
CXX := LD_RUN_PATH=$(GCC_DIR)/lib64 $(GCC_DIR)/bin/g++
LDFLAGS  += -static-libstdc++
CXXFLAGS += -std=gnu++14 -O3

CXXFLAGS += -I$(SFITSIO_DIR)/include
LDFLAGS  += -L$(SFITSIO_DIR)/lib64 -lsllib -lsfitsio -Xlinker -rpath -Xlinker $(SFITSIO_DIR)/lib64 -lpng

CXXFLAGS += -fopenmp
LDFLAGS  += -fopenmp


obj := $(patsubst %.cpp, %.o, $(wildcard *.cpp))

all: fits2png

run: all
	./fits2png

fits2png: $(obj) $(wildcard *.h)
	$(CXX) -o $@ $(CXXFLAGS) $(LDFLAGS) $(obj)

clean:
	-find . -name '*.o' | xargs -r rm
	-rm fits2png