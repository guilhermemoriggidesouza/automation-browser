echo "digite seu email"
set /p email=
echo "digite sua senha"
set /p pass=

forever index.js %email% %pass%

