import { useState } from "react";
import { MainLayout } from "./components/layouts/MainLayout";

import {
    Navigation,
    PageNames,
    getNavButtons,
    pages,
} from "./components/Navigation";

function App() {
    const [currentPageName, setPageName] = useState<PageNames>("examples");

    const [headingText, Page] = pages[currentPageName];

    return (
        <>
            <MainLayout>
                {headingText}
                <Navigation>{getNavButtons(setPageName)}</Navigation>
                <Page />
            </MainLayout>
        </>
    );
}

export default App;
