using System.Xml.Linq;

namespace Herald.Architecture.Tests;

// Reads project references from the project files: the compiler drops an unused reference from the
// assembly, so assembly metadata alone cannot see a forbidden reference that no type uses yet.
internal static class ProjectReferences
{
    public static string[] Of(string project) => InFile(Path.Combine(RepositoryRoot, "src", project, $"{project}.csproj"));

    public static string[] InFile(string projectFile) =>
        [.. XDocument.Load(projectFile).Descendants("ProjectReference")
            .Select(reference => Path.GetFileNameWithoutExtension(reference.Attribute("Include")!.Value.Replace('\\', '/')))];

    public static string RepositoryRoot { get; } = FindRepositoryRoot();

    private static string FindRepositoryRoot()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            if (File.Exists(Path.Combine(directory.FullName, "Herald.slnx")))
            {
                return directory.FullName;
            }
        }

        throw new InvalidOperationException("Herald.slnx not found above the test output directory.");
    }
}
