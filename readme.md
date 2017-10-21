# sln-opener

[![npm version](https://badge.fury.io/js/sln-opener.svg)](https://badge.fury.io/js/sln-opener)

A simple command line tool for opening solution files via the console.

It will look for solution files (.sln) and open them. If multiple solution files are found, they will be listed as a menu to pick from.  The first menu option allows you to open all solutions found.

When this tool initially loads it will ask for the path to your Visual Studio instance.  It also requires you to run your CLI in administrative mode.

## Install 

```
npm install -g sln-opener
```

## Usage

In a directory that has visual studio solution files type:

```
os
```