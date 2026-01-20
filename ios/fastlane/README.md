fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios install_pods

```sh
[bundle exec] fastlane ios install_pods
```

Install CocoaPods dependencies

### ios build

```sh
[bundle exec] fastlane ios build
```

Build the app

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Push a new beta build to TestFlight

### ios release

```sh
[bundle exec] fastlane ios release
```

Push a new release to the App Store

### ios sync_certificates

```sh
[bundle exec] fastlane ios sync_certificates
```

Sync code signing certificates and profiles

### ios register_device

```sh
[bundle exec] fastlane ios register_device
```

Register new devices

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
