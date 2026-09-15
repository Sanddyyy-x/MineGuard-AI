[app]

# (str) Title of your application
title = MineGuard

# (str) Package name
package.name = mineguard

# (str) Package domain
package.domain = org.mineguard

# (str) Source code directory
source.dir = .

# (str) Main entry point


# (str) Application version
version = 1.0

# (list) Python files/extensions to include
source.include_exts = py,kv,png,jpg,jpeg,atlas,json,txt

# (list) Python modules required by the application
requirements = python3,kivy,kivymd,supabase,python-dotenv,requests

# (str) Orientation
orientation = portrait

# (list) Android permissions
android.permissions = INTERNET,CAMERA

# (str) Android API target
android.api = 35

# (str) Android minimum API
android.minapi = 23

# (str) Android architecture
android.arch = arm64-v8a

# (bool) Fullscreen
fullscreen = 0

# (str) Presplash
# presplash.filename = %(source.dir)s/data/presplash.png

# (str) Icon
# icon.filename = %(source.dir)s/data/icon.png


[buildozer]

# (str) Log level
log_level = 2

# (str) Warning if running as root
warn_on_root = 1