const logger = require('../log');

module.exports.getCredentials = function () {
    var options = {};
    options.customerAlias = 'MatiasRomano';
    options.databaseAlias = 'Main';
    options.userId = 'mati.api';
    options.password = 'Reptyl.13';
    options.clientId = '2ba7b1a0-e451-43a1-93ce-c3048e4adda7';
    options.clientSecret = 'HrLgm5hM3wniImN5E2XXeril/6lchmXiOXx+IGSxYJE=';
    return options;
};

module.exports.main = async function (ffCollection, vvClient, response) {
    /*
    Script Name:    CreateFormBM8WS
    Customer:       Sandbox
    Purpose:        Generate a new form record of template B using the data filled in another form record of template A
    Preconditions:  none
    Parameters:     none
    Return Object:
                    outputCollection[0]: Status
                    outputCollection[1]: Short description message
                    outputCollection[2]: Data
    Pseudo code: 
                    1° Get the form ID of the form record of template A
                    2° Query the data of the above form record based on its form ID
                    3° With the data of this form record create another form record of template B
                    ...
 
    Date of Dev:    09/15/2022
    Last Rev Date:  09/15/2022
 
    Revision Notes:
                    07/30/2021 - DEVELOPER NAME HERE:  First Setup of the script
    */

    logger.info('Start of the process SCRIPT NAME HERE at ' + Date());

    /* -------------------------------------------------------------------------- */
    /*                    Response and error handling variables                   */
    /* -------------------------------------------------------------------------- */

    // Response array
    let outputCollection = [];
    // Array for capturing error messages that may occur during the process
    let errorLog = [];

    /* -------------------------------------------------------------------------- */
    /*                           Configurable Variables                           */
    /* -------------------------------------------------------------------------- */
    const templateAName = `8A_Milestone`;
    const templateBName = '8B_Milestone';
    /* -------------------------------------------------------------------------- */
    /*                          Script 'Global' Variables                         */
    /* -------------------------------------------------------------------------- */

    // Description used to better identify API methods errors

    /* -------------------------------------------------------------------------- */
    /*                              Helper Functions                              */
    /* -------------------------------------------------------------------------- */

    function getFieldValueByName(fieldName, isRequired = true) {
        /*
        Check if a field was passed in the request and get its value
        Parameters:
            fieldName: The name of the field to be checked
            isRequired: If the field is required or not
        */

        let resp = null;

        try {
            // Tries to get the field from the passed in arguments
            const field = ffCollection.getFormFieldByName(fieldName);

            if (!field && isRequired) {
                throw new Error(`The field '${fieldName}' was not found.`);
            } else if (field) {
                // If the field was found, get its value
                let fieldValue = field.value ? field.value : null;

                if (typeof fieldValue === 'string') {
                    // Remove any leading or trailing spaces
                    fieldValue = fieldValue.trim();
                }

                if (fieldValue) {
                    // Sets the field value to the response
                    resp = fieldValue;
                } else if (isRequired) {
                    // If the field is required and has no value, throw an error
                    throw new Error(`The value property for the field '${fieldName}' was not found or is empty.`);
                }
            }
        } catch (error) {
            // If an error was thrown, add it to the error log
            errorLog.push(error);
        }
        return resp;
    }

    function parseRes(vvClientRes) {
        /*
        Generic JSON parsing function
        Parameters:
            vvClientRes: JSON response from a vvClient API method
        */
        try {
            // Parses the response in case it's a JSON string
            const jsObject = JSON.parse(vvClientRes);
            // Handle non-exception-throwing cases:
            if (jsObject && typeof jsObject === 'object') {
                vvClientRes = jsObject;
            }
        } catch (e) {
            // If an error occurs, it's because the resp is already a JS object and doesn't need to be parsed
        }
        return vvClientRes;
    }

    function checkMetaAndStatus(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the meta property of a vvClient API response object has the expected status code
        Parameters:
            vvClientRes: Parsed response object from a vvClient API method
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkData(), make sure to pass the same param as well.
        */

        if (!vvClientRes.meta) {
            throw new Error(`${shortDescription} error. No meta object found in response. Check method call parameters and credentials.`);
        }

        const status = vvClientRes.meta.status;

        // If the status is not the expected one, throw an error
        if (status != 200 && status != 201 && status != ignoreStatusCode) {
            const errorReason = vvClientRes.meta.errors && vvClientRes.meta.errors[0] ? vvClientRes.meta.errors[0].reason : 'unspecified';
            throw new Error(`${shortDescription} error. Status: ${vvClientRes.meta.status}. Reason: ${errorReason}`);
        }
        return vvClientRes;
    }

    function checkDataPropertyExists(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the data property of a vvClient API response object exists 
        Parameters:
            res: Parsed response object from the API call
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkMeta(), make sure to pass the same param as well.
        */
        const status = vvClientRes.meta.status;
        if (status != ignoreStatusCode) {
            // If the data property doesn't exist, throw an error
            if (!vvClientRes.data) {
                throw new Error(`${shortDescription} data property was not present. Please, check parameters and syntax. Status: ${status}.`);
            }
        }

        return vvClientRes;
    }

    function checkDataIsNotEmpty(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the data property of a vvClient API response object is not empty
        Parameters:
            res: Parsed response object from the API call
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkMeta(), make sure to pass the same param as well.
        */
        const status = vvClientRes.meta.status;

        if (status != ignoreStatusCode) {
            const dataIsArray = Array.isArray(vvClientRes.data);
            const dataIsObject = typeof vvClientRes.data === 'object';
            const isEmptyArray = dataIsArray && vvClientRes.data.length == 0;
            const isEmptyObject = dataIsObject && Object.keys(vvClientRes.data).length == 0;

            // If the data is empty, throw an error
            if (isEmptyArray || isEmptyObject) {
                throw new Error(`${shortDescription} returned no data. Please, check parameters and syntax. Status: ${status}.`);
            }
            // If it is a Web Service response, check that the first value is not an Error status
            if (dataIsArray) {
                const firstValue = vvClientRes.data[0];

                if (firstValue == 'Error') {
                    throw new Error(`${shortDescription} returned an error. Please, check called Web Service. Status: ${status}.`);
                }
            }
        }
        return vvClientRes;
    }

    function getFormAData(formID) {
        const shortDescription = `Get form ${formID}`;

        const getFormsParams = {
            q: `[Form ID] eq '${formID}'`,
            expand: true, // true to get all the form's fields
            // fields: "Name,Last Name,Phone,City", // to get only the fields 'id' and 'name'
        };
        return vvClient.forms
            .getForms(getFormsParams, templateAName)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res, shortDescription))
            .then((res) => checkDataPropertyExists(res, shortDescription))
            .then((res) => checkDataIsNotEmpty(res, shortDescription))
            .then((res) => res.data[0]);
    }

    function postFormBData(formAData) {
        const shortDescription = `Post form ${templateBName}`;
        const newFormData = {
            Name: formAData.name,
            ['Company Name']: formAData.company,
            ['Field to Update']: 'This is a mock value',
        };
        return vvClient.forms
            .postForms(null, newFormData, templateBName)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res, shortDescription))
            .then((res) => checkDataPropertyExists(res, shortDescription))
            .then((res) => checkDataIsNotEmpty(res, shortDescription));
    }

    /* -------------------------------------------------------------------------- */
    /*                                  MAIN CODE                                 */
    /* -------------------------------------------------------------------------- */

    try {
        // GET THE VALUES OF THE FIELDS
        const formID = getFieldValueByName('Form ID');

        // CHECKS IF THE REQUIRED PARAMETERS ARE PRESENT
        if (!formID) {
            // Throw every error getting field values as one
            throw new Error(errorLog.join('; '));
        }

        // YOUR CODE GOES HERE
        const formAData = await getFormAData(formID);
        const formBData = await postFormBData(formAData);

        // BUILD THE SUCCESS RESPONSE ARRAY
        outputCollection[0] = 'Success'; // Don´t change this
        outputCollection[1] = 'The form record was created';
        outputCollection[2] = formBData.data.instanceName;
    } catch (error) {
        logger.info('Error encountered' + error);

        // BUILD THE ERROR RESPONSE ARRAY
        outputCollection[0] = 'Error'; // Don´t change this

        if (errorLog.length > 0) {
            outputCollection[1] = 'Some errors ocurred';
            outputCollection[2] = `Error/s: ${errorLog.join('; ')}`;
        } else {
            outputCollection[1] = error.message ? error.message : `Unhandled error occurred: ${error}`;
        }
    } finally {
        // SEND THE RESPONSE
        response.json(200, outputCollection);
    }
};
