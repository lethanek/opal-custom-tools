import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";
import crypto from "node:crypto";

interface ContentParameters {
    task_id: string;
    step_id: string;
    substep_id: string;
}


async function createArticle(parameters: ContentParameters) {
  const { task_id, step_id, substep_id } = parameters;
  let content: string;

    // get the cmp token
    let cmpToken = null;
    async function getCMPToken(){
       const response = await fetch("https://accounts.cmp.optimizely.com/o/oauth2/v1/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "client_id": "306dd5df-dbee-4fc1-9ad8-5f8a43f4ddba",
                "client_secret": "4b50020271b2b34bd18e2757f8f1ea37afa03244fd579de4064355d29eb6fb10",
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

    // get the cms token
    let cmsToken = null;
    async function getCMSToken(){
       const response = await fetch("https://api.cms.optimizely.com/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "grant_type": "client_credentials",
                "client_id": "1fad7c59f238426eae414c199288e00a",   
                "client_secret": "D0igxjKyxyOHNbvJOqRZ1ssJSIyg2DJWYiL2Vs3G2zIrymjL",
                "act_as": "dan.oneil@optimizely.com"
            })
        });

        const data = await response.json();
        
        if (data.access_token) {
            cmsToken = data.access_token;
            return data.access_token;
        } else {
            throw new Error("No CMS access token received");
        }
    }
    await getCMSToken();

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

            await createCMSContent(cmpToken!, cmsToken!, cmpTitle, cmpHtml);
            
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
                let cmpMetaTitle = structuredContent.latest_fields_version.fields.metaTitle[0].field_values[0].text_value;
                let cmpMetaDescription = structuredContent.latest_fields_version.fields.metaDescription[0].field_values[0].text_value;

                await createCMSContent(cmpToken!, cmsToken!, cmpTitle, cmpHtml, cmpMetaTitle, cmpMetaDescription);
            
                return data;
            }

            
        } else {
            throw new Error("Could not get CMP content");
        }
    }
    await getCMPStructuredContent(cmpToken!);


    // create the cms entry
    async function createCMSContent(cmpToken: string, cmsToken: string, cmpTitle: string, cmpHtml: string, cmpMetaTitle?: string, cmpMetaDescription?: string){
       const response = await fetch(`https://api.cms.optimizely.com/preview3/experimental/content`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cmsToken}`
            },
            body: JSON.stringify({
                "key": crypto.randomUUID().replace(/-/g, ""),
                "contentType": "ArticlePage",
                "locale": "en",
                "container": "0636cf53acc343f18db5b0c2444d0683",
                "status": "draft",
                "displayName": `${cmpTitle}`,
                "properties": {
                    "Heading": `${cmpTitle}`,
                    "SubHeading": "",
                    "Body": `${cmpHtml}`,
                    "SeoSettings": {
                        "GraphType": "article",
                        "MetaDescription": cmpMetaDescription || "",
                        "MetaTitle": cmpMetaTitle || ""
                    },
                    "PromoImage": "cms://content/198243681c3140cba16ed8665e2573f0"
                }
            })
        });

        const data = await response.json();

        if (data.routeSegment) {
            
            const updateTask = await fetch(`https://api.cmp.optimizely.com/v3/tasks/${task_id}/steps/${step_id}/sub-steps/${substep_id}/external-work`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${cmpToken}`
                },
                body: JSON.stringify({
                    "title":`${cmpTitle}`,
                    "status":"Complete",
                    "url":`https://shenandoahu.netlify.app/articles/${data.routeSegment}`
                })
            });
        } else {
            throw new Error("didn't return routeSegment");
        }
    }
    //await getCMPContent(cmpToken!);



  content = "Content Created Successfully";

  return {
    content
  };
}



tool({
  name: "shenandoah-create-article",
  description:
    "Gets content from a CMP task and creates an article in Shenandoah CMS.",
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
    }
  ],
})(createArticle);