param (
    [string]$network = "rinkeby"
)

truffle compile
if ($?)
{
    Write-Output "Compilation succeeded."
    Write-Output "Starting deployment on '$network' network."
    truffle exec deploy.js --network $network
}
else
{
    Write-Output "Compilation failed."
    Write-Output "exiting..."
}