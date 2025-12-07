import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";

interface ContentParameters {
    task_id: string;
    step_id: string;
    substep_id: string;
    cmp_client_id: string;
    cmp_client_secret: string;
    cms12_url: string;
}


async function createContent(parameters: ContentParameters) {
  const { task_id, step_id, substep_id, cmp_client_id, cmp_client_secret, cms12_url } = parameters; 
  let content = "";

    // get the cmp token
    let cmpToken = null;
    async function getCMPToken(){
       const response = await fetch("https://accounts.cmp.optimizely.com/o/oauth2/v1/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "client_id": `${cmp_client_id}`,
                "client_secret": `${cmp_client_secret}`,
                "grant_type": "client_credentials"
            })
        });

        const data = await response.json();
        
        if (data.access_token) {
            cmpToken = data.access_token;
            return data.access_token;
        } else {
            throw new Error("No CMP access token received");
        }
    }
    await getCMPToken();

    //get the article content from the cmp
    //let cmpTitle = null;
    //let cmpHtml = null;
    async function getCMPArticleContent(cmpToken: string){
       const response = await fetch(`https://api.cmp.optimizely.com/v3/tasks/${task_id}/assets`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cmpToken}`
            }
        });

        const data = await response.json();
        
        if (data) {
    
            cmpTitle = data.data[0].title;
            cmpHtml = data.data[0].content.value;

            await createCMSContent(cmpToken!, cmpTitle, cmpHtml);
            
            return data;
        } else {
            throw new Error("Could not get CMP content");
        }
    }
    //await getCMPArticleContent(cmpToken!);


//get the structured content from the cmp
    let cmpTitle = null;
    let cmpHtml = null;
    let cmpMetaTitle = null;
    let cmpMetaDescription = null;
    let cmpImage = null;
    async function getCMPStructuredContent(cmpToken: string){
       const response = await fetch(`https://api.cmp.optimizely.com/v3/tasks/${task_id}/assets`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cmpToken}`
            }
        });

        const data = await response.json();
        
        if (data) {
    
            let structuredContentItemUrl = data.data[0].content.value;
            const fetchStructuredContent = await fetch(`${structuredContentItemUrl}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${cmpToken}`
                }
            });
            
            const structuredContent = await fetchStructuredContent.json();

            if(structuredContent){
                let cmpTitle = structuredContent.latest_fields_version.fields.title[0].field_values[0].text_value;
                let cmpHtml = structuredContent.latest_fields_version.fields.body[0].field_values[0].rich_text_value;
                let cmpAuthor = structuredContent?.latest_fields_version?.fields?.author?.[0]?.field_values?.[0]?.text_value ?? "Optimizely Author";                
                let cmpMetaTitle = structuredContent?.latest_fields_version?.fields?.metaTitle[0]?.field_values[0]?.text_value ?? "";
                let cmpMetaDescription = structuredContent?.latest_fields_version?.fields?.metaDescription[0]?.field_values[0]?.text_value ?? "";
                let cmpImageApi = structuredContent?.latest_fields_version?.fields?.featuredMedia?.[0]?.field_values?.[0]?.links?.self;

                content += `Using this for image request: ${cmpImageApi}\n`;

                const fetchImage = await fetch(`${cmpImageApi}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${cmpToken}`
                    }
                });
            
                const image = await fetchImage.json();

                content += `Image json: ${JSON.stringify(image)}\n`;

                if(image){
                    let imageUrl = image.url;
                    content += `Image URL: ${imageUrl}\n`;
                    await createCMSContent(cmpToken!, cmpTitle, cmpHtml, cmpMetaTitle, cmpMetaDescription, cmpAuthor, imageUrl, cms12_url);    
                }
                        
                return data;
            }

            
        } else {
            throw new Error("Could not get CMP content");
        }
    }
    await getCMPStructuredContent(cmpToken!);


    // create the cms entry
    async function createCMSContent(cmpToken: string, cmpTitle: string, cmpHtml: string, cmpMetaTitle?: string, cmpMetaDescription?: string, cmpAuthor?: string, cmpImageUrl?: string, cms12_url?: string){
       const response = await fetch(`${cms12_url}api/episerver/v3.0/contentmanagement`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": "EPiNumberOfVisits=1%2C2025-12-06T21%3A00%3A33; EPiServer_Commerce_AnonymousId=5dfbedba-1463-405d-9270-1f395d0a80f3; EPiStateMarker=true"
            },
            body: JSON.stringify({
                "language": {
                    "name": "en"
                },
                "contentType": [
                    "StandardPage"
                ],
                "parentLink": {
                    "id": 72,
                    "providerName": "string"
                },
                "name": `${cmpTitle}`,
                "status": "Published",
                "mainBody": {
                    "value": `${cmpHtml}`,
                    "propertyDataType": "PropertyXhtmlString"
                },
                "metaTitle": {
                    "value": `${cmpMetaTitle}`,
                    "propertyDataType": "PropertyLongString"
                },
                "pageDescription": {
                    "value": `${cmpMetaDescription}`,
                    "propertyDataType": "PropertyLongString"
                },
                "authorMetaData": {
                    "value": `${cmpAuthor}`,
                    "propertyDataType": "PropertyLongString"
                },
                "backgroundExternalUrl": {
                    "value": `${cmpImageUrl}`,
                    "propertyDataType": "PropertyLongString"
                },
                "backgroundOpacity": {
                    "value": 0.0,
                    "propertyDataType": "PropertyFloatNumber"
                },
                "topPaddingMode": {
                    "value": "Half",
                    "propertyDataType": "PropertyLongString"
                }
            })
        }); 

        const data = await response.json();

        if (data.contentLink.url) {
            
            const addURL = await fetch(`https://api.cmp.optimizely.com/v3/tasks/${task_id}/urls`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${cmpToken}`
                },
                body: JSON.stringify({
                    "title":`${cmpTitle}`,
                    "url":`${data.contentLink.url}`
                })
            });
            
            const updateTask = await fetch(`https://api.cmp.optimizely.com/v3/tasks/${task_id}/steps/${step_id}/sub-steps/${substep_id}/external-work`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${cmpToken}`
                },
                body: JSON.stringify({
                    "title":`${cmpTitle}`,
                    "status":"Complete",
                    "url":`${data.contentLink.url}`
                })
            });

            const completeStep = await fetch(`https://api.cmp.optimizely.com/v3/tasks/${task_id}/steps/${step_id}/sub-steps/${substep_id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${cmpToken}`
                },
                body: JSON.stringify({
                    "is_completed":true
                })
            });

            

        } else {
            throw new Error("didn't return routeSegment");
        }
    }
    //await getCMPContent(cmpToken!);



  content += "Content Created Successfully";

  return {
    content
  };
}



tool({
  name: "create_cms12_from_cmp",
  description:
    "Gets content from a CMP and creates a CMS12 entry",
  parameters: [
     {
      name: "task_id",
      type: ParameterType.String,
      description: "ID of the task",
      required: true,
    },
     {
      name: "step_id",
      type: ParameterType.String,
      description: "Step ID of the task",
      required: true,
    },
     {
      name: "substep_id",
      type: ParameterType.String,
      description: "Substep ID of the task",
      required: true,
    },
     {
      name: "cmp_client_id",
      type: ParameterType.String,
      description: "CMP Client ID",
      required: true,
    },
     {
      name: "cmp_client_secret",
      type: ParameterType.String,
      description: "CMP Client Secret",
      required: true,
    },
    {
      name: "cms12_url",
      type: ParameterType.String,
      description: "URL for the CMS12 instance.",
      required: true,
    }
  ],
})(createContent);