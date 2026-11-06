using System.Reflection;

namespace Herald.Architecture.Tests;

// The one list of modules (ADR 0004). A change that adds, merges, splits or renames a module updates it.
public static class Modules
{
    public static readonly string[] Names = ["Organisations", "Tournaments", "Registration", "Competition", "Standings"];

    public static TheoryData<string> All => new(Names);

    public static Assembly Load(string module) => Assembly.Load($"Herald.{module}");
}
