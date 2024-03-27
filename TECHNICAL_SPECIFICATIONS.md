# Technical specifications
This document will detail the inner workings of subliminal,
and will hopefully break down many of the complex processes
going on behind the simple facade of the site. It is recommended
you read this to aid contributing or developing for this site.

## Developing:
**Cloning sources:**
 - This repository makes use of **submodules**, when cloning make sure to run
 `git clone --recursive https://github.com/Zekiah-A/Subliminal.git` to allow you
 to develop the server without missing dependency errors.
 - If you have already cloned the respository without submodules, or want to ensure 
 all submodules are at the latest version, enter the directory and run
 `git submodule update --remote`

**Development dependencies:**
 - Latest version of `dotnet`, preferably .net 8 prerelease.
 - `node`, `npm` and `npx` may be used in order to debug the client, 
 use `node test-server.js` to take advantage of the special page navigation 
 functionality used by the site.

**Recommended software:**
 - Jetbrains Rider for server development.
 - Alternatively, VSCode, with `sqlite-viewer`, JS and C# extensions installed
 for developing on the client and debugging the database on the server.

**Coding style:**
 - Please write normal code that is not stupidly minified, bloated as a subsequence of 
 over-engineering and generally conforms to the language guides.
 - Exceptions to standard rules are the following:
   - In C# code, do not use _ in private class property names (this isn't the .NET runtime,
 and `this.` exists)
   - In javascript, avoid `;` when not necessary. 
   - Always indent by 4 spaces. Don't attempt to line things up with sub-4 spacing,
   if it doesn't line up, then it was not meant to be! When wrapping a line try to break
   somewhere where it is clear that the next line is a continuation of the previous and
   not a new statement, then nicely indent the next line with 4 pretty spaces. For example:
   ```cs
   await myepicClass.AttemptToDoSomethingCoolAsync<EpicDatabase>(
       new EpicDatabase($"Data Source={config.epicDatabaseSource}"));
   ```
   - Please never do single line shenanigans, such as:
   ```cs
   if (myCondition) PleaseDoSomething(); // :^( - Not nice to add another statement here
   if (myCondition)
   {
       // :^) - Yay we can expand in the future if we need to!
       PleaseDoSomething();
       // Console.WriteLine("I did something!!!");
   }
   
   // :^( - All talk and no game... What if we want to in the future??
   void PleaseDoSomething() => Console.WriteLine("I'm, trying!");
   // :^) - Oh yeah! This method is going to be so useful in the future!
   void PleaseDoSomething()
   {
        var answer = 1 + 41;
        Console.WriteLine($"I found the answer to life! {answer}");
   }
   ```
   Trust me, single line shenanigans makes adding and maintaining code in the future such a
   pain, makes it much harder to skim read logic without having to read infinitely long lines,
   and isn't worth the negligible "space" saving.

**Additional:**
 - During development, the best way to modify change the DB schema without having to create tons of
 new migrations is to utilise `ef migrations remove` along with `ef migrations add [migration name]`
 to quickly change and prototype new schemas.
 
### EFCore database setup:
The following steps need to be taken to prepare the site database for use:
 - dotnet tool install --global dotnet-ef
 - dotnet ef migrations add InitialCreate
 - dotnet ef database update
 - Prerelease .NET 8 may require "dotnet tool install --global dotnet-ef --prerelease"
 to update from a non-prerelease, do "dotnet tool update --global dotnet-ef --prerelease".
 If using a prerelease .NET 8 ensure you are on the latest build possible to avoid runtime bugs.

## Live Edit
tbc

## Poem Purgatory
tbc

## Accounts
tbc
