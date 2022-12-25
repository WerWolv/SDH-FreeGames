import {
  definePlugin,
  Field,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  staticClasses,
  DialogButton,
  DialogLabel,
  Router
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

function getEpicGamesFreeGame(serverAPI: ServerAPI) {
  var url = "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?country=US";
  
  
  return serverAPI.fetchNoCors(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
  .then(response => {
    console.log(response)
    return JSON.parse((response.result as any).body)
  })
  .then(data => {
    return data["data"]["Catalog"]["searchStore"]["elements"][0];
  }).catch(error => console.warn(error));
}

function sendToast(serverAPI: ServerAPI) {
  getEpicGamesFreeGame(serverAPI).then(response => {
    serverAPI.toaster.toast({
      title: "New free game from Epic Game Store!",
      body: response["title"],
      duration: 5000,
      critical: true,
      onClick: () => Router.NavigateToExternalWeb(`https://store.epicgames.com/en-US/p/${response["productSlug"]}`)
    });
  });
  
}

const QuickAccessMenu: VFC<{}> = () => {
  const [title, setTitle] = useState([]);
  const [slug, setSlug] = useState([]);
  const [desc, setDesc] = useState([]);
  useEffect(() => {
    getEpicGamesFreeGame(globalServerAPI).then(response => {
      setTitle(response["title"]);
      setSlug(response["productSlug"]);
      setDesc(response["description"]);
    });
  });

  return (
    <PanelSection title="Epic Games">
      <PanelSectionRow>
        <Field
          bottomSeparator="none"
          icon={<FaGamepad/>}
          label={title}
          childrenLayout={"below"}
        >
          <DialogLabel>{desc}</DialogLabel>
          <br/>
          <DialogButton
            onClick={() => Router.NavigateToExternalWeb(`https://store.epicgames.com/en-US/p/${slug}`) }
          >
            Open Store Page
          </DialogButton>
        </Field>
      </PanelSectionRow>
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
