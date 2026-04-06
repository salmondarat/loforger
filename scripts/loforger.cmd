@echo off
REM Loforger CLI wrapper for Windows
REM This file is used as a fallback; npm creates its own .cmd shim from the "bin" field.
node "%~dp0\..\dist\index.js" %*
