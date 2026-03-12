@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM Begin all REM://!sym!//sym!sym!
@echo off
@REM Set title of command window
title %0

@setlocal

set ERROR_CODE=0

@REM To isolate internal variables from possible post scripts, we use another setlocal
@setlocal

@REM ==== START VALIDATION ====
if not "%JAVA_HOME%" == "" goto OkJHome

echo.
echo Error: JAVA_HOME not found in your environment. >&2
echo Please set the JAVA_HOME variable in your environment to match the >&2
echo location of your Java installation. >&2
echo.
goto error

:OkJHome
if exist "%JAVA_HOME%\bin\java.exe" goto init

echo.
echo Error: JAVA_HOME is set to an invalid directory. >&2
echo JAVA_HOME = "%JAVA_HOME%" >&2
echo Please set the JAVA_HOME variable in your environment to match the >&2
echo location of your Java installation. >&2
echo.
goto error

:init
@REM Find the project base dir
set MAVEN_PROJECTBASEDIR=%~dp0
:findBaseDir
IF EXIST "%MAVEN_PROJECTBASEDIR%\.mvn" goto baseDirFound
cd ..
IF "%cd%"=="%cd:~0,3%" goto baseDirNotFound
set MAVEN_PROJECTBASEDIR=%cd%
goto findBaseDir

:baseDirFound
set MVNW_REPOURL=https://repo.maven.apache.org/maven2

@REM Detect wrapper jar
for /f "usebackq tokens=1,2 delims==" %%a in ("%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties") do @(
    if "%%a"=="wrapperUrl" set WRAPPER_URL=%%b
    if "%%a"=="distributionUrl" set DIST_URL=%%b
)

set WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"

@REM Download maven-wrapper.jar if not present
if exist %WRAPPER_JAR% goto runMaven

echo Downloading Maven Wrapper...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile %WRAPPER_JAR%}"
if "%ERRORLEVEL%" == "0" goto runMaven
echo Failed to download maven-wrapper.jar
goto error

:runMaven
"%JAVA_HOME%\bin\java.exe" ^
  -jar %WRAPPER_JAR% ^
  -distributionUrl "%DIST_URL%" ^
  %*

if ERRORLEVEL 1 goto error
goto end

:baseDirNotFound
echo.
echo Error: Could not find .mvn directory. >&2
goto error

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%

cmd /C exit /B %ERROR_CODE%
