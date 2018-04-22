PROJECT=FlipM

SRC_DIR=src
BUILD_DIR=build

MODE := $(if $(MODE),$(MODE),Debug)

RM=rm -Rf
MKDIR=mkdir -p

XCB_PROJECT=$(PROJECT).xcodeproj
XCB_SCHEME=$(PROJECT)-macosx
XCB=xcodebuild
XCB_BUILD_DIR=$(BUILD_DIR)/xcode
XCB_BUILD_FLAGS=build -project $(XCB_PROJECT) -scheme $(XCB_SCHEME) -configuration $(MODE) -derivedDataPath $(XCB_BUILD_DIR)
XCB_APP=$(XCB_BUILD_DIR)/Build/Products/$(MODE)/$(XCB_SCHEME).app

all: debug

debug: $(XCB_APP)

.PHONY: release
release:
	$(MAKE) MODE=Release

.PHONY: clean
clean:
	$(RM) $(BUILD_DIR)

run: $(XCB_APP)
	open $<

.PHONY: $(XCB_APP)
$(XCB_APP):
	$(XCB) $(XCB_BUILD_FLAGS)
