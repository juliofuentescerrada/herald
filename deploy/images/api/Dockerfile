# The host (m4-images D-1 to D-3): the output of `dotnet publish src/Herald.Host -c Release -o out/api`, nothing from tools/ or tests/.
FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:aac50ceef10391e78a899e3d2ccd00bbafa2dcb56ccf4586cbccf00edb84fc21
WORKDIR /app
COPY out/api/ ./
USER $APP_UID
ENTRYPOINT ["dotnet", "Herald.Host.dll"]
