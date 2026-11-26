# The reset-and-seed job (m4-images D-1, D-2): the output of `dotnet publish tools/Herald.Seed -c Release -o out/seed`.
# ASP.NET Core's runtime, because the tool runs the host in process.
FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:aac50ceef10391e78a899e3d2ccd00bbafa2dcb56ccf4586cbccf00edb84fc21
WORKDIR /app
COPY out/seed/ ./
USER $APP_UID
ENTRYPOINT ["dotnet", "Herald.Seed.dll"]
