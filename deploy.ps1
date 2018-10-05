truffle compile
if ($?)
{
    Write-Output "Compilation succeeded."
    Write-Output "Starting deployment."
    truffle exec deploy.js --network rinkeby
}
else
{
    Write-Output "Compilation failed."
    Write-Output "exiting..."
}