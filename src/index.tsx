import {
  definePlugin,
  Field,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  staticClasses,
  DialogButton,
  DialogLabel,
  Router,
  SteamSpinner
} from "decky-frontend-lib";
import { useEffect, useState, VFC } from "react";
import { FaCriticalRole, FaGamepad } from "react-icons/fa";


// interface AddMethodArgs {
//   left: number;
//   right: number;
// }

var globalServerAPI: ServerAPI;
var intervalId: NodeJS.Timer;
var lastCheckDate: number = 999;

function getEpicGamesFreeGames(serverAPI: ServerAPI) {
  var url = "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?country=US";
  
  
  return serverAPI.fetchNoCors(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
  .then(response => {
    return JSON.parse((response.result as any).body)
  })
  .then(data => {
    let list: any[] = [];

    for (let entry of data["data"]["Catalog"]["searchStore"]["elements"]) {
      if (entry["productSlug"] != "[]")
        list.push(entry);
    }

    return list;
  }).catch(error => console.warn(error));
}

function sendToast(serverAPI: ServerAPI) {
  getEpicGamesFreeGames(serverAPI).then(response => {
    for (let entry of response as any[]) {
      serverAPI.toaster.toast({
        title: "New free game from Epic Game Store!",
        body: entry["title"],
        duration: 5000,
        critical: true,
        onClick: () => Router.NavigateToExternalWeb(`https://store.epicgames.com/en-US/p/${entry["productSlug"]}`)
      });
    }
  });
  
}

const QuickAccessMenu: VFC<{}> = () => {
  let newFields: any[] = [];
  const [fields, setFields] = useState(newFields);

  useEffect(() => {
    let result: any[] = [];
    getEpicGamesFreeGames(globalServerAPI).then((entries) => {
      for (let entry of entries as any[]) {
        console.log(entry)
        result.push((
          <PanelSectionRow>
            <Field
              bottomSeparator="none"
              icon={<FaGamepad/>}
              label={entry["title"]}
              childrenLayout={"below"}
            >
              <DialogLabel>{entry["description"]}</DialogLabel>
              <br/>
              <DialogButton
                onClick={() => Router.NavigateToExternalWeb(`https://store.epicgames.com/en-US/p/${entry["productSlug"]}`) }
              >
                Open Store Page
              </DialogButton>
            </Field>
          </PanelSectionRow>
        ));
      }

      setFields(result);
    })
  }, []);

  return (
    <PanelSection title="Epic Games">
      { fields.length == 0 ? <SteamSpinner/> : fields }
    </PanelSection>
  )
};

const Content: VFC<{ serverAPI: ServerAPI }> = () => {
  return (
    <QuickAccessMenu/>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  globalServerAPI = serverApi;

  intervalId = setInterval(() => {
     const now = new Date().getDate();

     if (now != lastCheckDate) {
        sendToast(serverApi);
      }

      lastCheckDate = now;
  }, 1000);

  return {
    title: <div className={staticClasses.Title}>Free Games</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <FaCriticalRole />,
    onDismount() {
      clearInterval(intervalId);
    },
  };
});
