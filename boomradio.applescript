tell application "Music"
    activate
end tell

try
    do shell script "open 'https://music.apple.com/gb/station/boom-radio/ra.1550204458'"
    display notification "Opening Boom Radio..." with title "Music"
on error errMsg
    display notification "Failed to open Boom Radio: " & errMsg with title "Error"
end try