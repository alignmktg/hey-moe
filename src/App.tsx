import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import {
  listOutline,
  gridOutline,
  layersOutline,
  chatbubbleOutline,
} from "ionicons/icons";

import ListView from "./components/views/ListView/ListView";
import KanbanBoard from "./components/views/KanbanView/KanbanBoard";
import SwipeCardStack from "./components/views/SwipeStackView/SwipeCardStack";
import MoeView from "./components/views/MoeView/MoeView";

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Redirect exact path="/" to="/list" />
            <Route path="/list" render={() => <ListView />} exact />
            <Route path="/kanban" render={() => <KanbanBoard />} exact />
            <Route path="/swipe" render={() => <SwipeCardStack />} exact />
            <Route path="/moe" render={() => <MoeView />} exact />
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="list" href="/list">
              <IonIcon icon={listOutline} />
              <IonLabel>List</IonLabel>
            </IonTabButton>
            <IonTabButton tab="kanban" href="/kanban">
              <IonIcon icon={gridOutline} />
              <IonLabel>Kanban</IonLabel>
            </IonTabButton>
            <IonTabButton tab="swipe" href="/swipe">
              <IonIcon icon={layersOutline} />
              <IonLabel>Swipe</IonLabel>
            </IonTabButton>
            <IonTabButton tab="moe" href="/moe">
              <IonIcon icon={chatbubbleOutline} />
              <IonLabel>Moe</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
}
