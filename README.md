[<img align="right" src="https://img.shields.io/amo/stars/gesturefy.svg">](https://addons.mozilla.org/firefox/addon/gesturefy/reviews/)
[<img align="right" src="https://img.shields.io/amo/users/gesturefy.svg">](https://addons.mozilla.org/firefox/addon/gesturefy/statistics)
[<img align="right" src="https://img.shields.io/github/release/robbendebiene/gesturefy.svg">](https://github.com/Robbendebiene/Gesturefy/releases)
[<img align="right" src="https://img.shields.io/github/license/robbendebiene/gesturefy.svg">](https://github.com/Robbendebiene/Gesturefy/blob/master/LICENSE)


# <sub><img src="https://github.com/Robbendebiene/Gesturefy/blob/master/src/resources/img/iconx48.png" height="38" width="38"></sub>esturefy


#### [<img align="right" src="https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_2.png">](https://addons.mozilla.org/firefox/addon/gesturefy/) Navigate, operate and browse faster with mouse gestures! A customizable Firefox mouse gesture add-on with a variety of different commands.


***

**Features:**

 - Mouse gestures (Move mouse while holding the left, middle, or right button)
 - Rocker gestures (Left-click with holding right-click and vice versa)
 - Wheel gestures (Scroll wheel while holding the left, middle, or right button)
 - Over 60 different executable commands
 - Customizable status information on mouse gestures
 - Custom gesture -> command mapping
 - Blacklist support
 - Synchronized configuration across devices (if enabled in Firefox)
 - Multilingual


**Limitations / Problems:**

 - Currently the addon isn't working if **privacy.resistFingerprinting** is set to true under about:config
 - **MacOS Sierra:** Wheel gestures currently doesn't work (see this [bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1424893))
 - The addon does not work on [addons.mozilla.org](https://addons.mozilla.org), pure SVG pages and internal pages like most "about:" tabs (e.g. about:newtab, about:addons) or other addon option pages (moz-extension://).
 - The page must be partially loaded to perform gestures.


**If you want to contribute to this project, you can do so by helping translate Gesturefy on [Crowdin](https://crowdin.com/project/gesturefy)!**

**Why does Gesturefy require permission X?**

 - Access your data for all websites: *This is a key permission, because the complete gesture functionality is injected in every web page you visit (which means a part of the code is running in each tab). This is necessary, because with the new API there is no other way to track your mouse movement or draw anything on the screen. It's also needed to perform page specific commands like scroll down or up.*
 - Read and modify browser settings:  *This is required to change the context menu behaviour for MacOS and Linux user to support the usage of the right mouse button.*
 - Display notifications to you: *This is used to show a notification on update or certain error messages.*
 - Access recently closed tabs: *This is required for the command which allows to restore the last closed tab.*


***

**[Version History/Releases](https://github.com/Robbendebiene/Gesturefy/releases)**
