

# Refernce to this script - https://docs.microsoft.com/en-us/azure/virtual-machines/windows/ps-template


#create a new resurce grup
New-AzureRmResourceGroup -Name "myResourceGroup" -Location "West US"





#Create a new storage account and container:
$storageName = "st" + (Get-Random)

New-AzureRmStorageAccount -ResourceGroupName "myResourceGroup" -AccountName $storageName -Location "West US" -SkuName "Standard_LRS" -Kind Storage

$accountKey = (Get-AzureRmStorageAccountKey -ResourceGroupName myResourceGroup -Name $storageName).Value[0]

$context = New-AzureStorageContext -StorageAccountName $storageName -StorageAccountKey $accountKey 

New-AzureStorageContainer -Name "templates" -Context $context -Permission Container






# Upload the files to the storage account:
Set-AzureStorageBlobContent -File "D:\projects\Automatic​_Grids_​Creation\srs\deploy_vm_to_azure\windows_server_2012\CreateVMTemplate.json" -Context $context -Container "templates"

Set-AzureStorageBlobContent -File "D:\projects\Automatic​_Grids_​Creation\srs\deploy_vm_to_azure\windows_server_2012\Parameters.json" -Context $context -Container templates




# Deploy the template using the parameters:
$templatePath = "https://" + $storageName + ".blob.core.windows.net/templates/CreateVMTemplate.json"

$parametersPath = "https://" + $storageName + ".blob.core.windows.net/templates/Parameters.json"

New-AzureRmResourceGroupDeployment -ResourceGroupName "myResourceGroup" -Name "myDeployment" -TemplateUri $templatePath -TemplateParameterUri $parametersPath