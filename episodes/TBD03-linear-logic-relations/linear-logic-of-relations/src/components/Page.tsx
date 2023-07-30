import styled from "styled-components";
import { examples1 } from "../logic/examples/expressions";

import { RenderRel } from "./RenderRel";

const PageContainer = styled.div``;

type Props = {};

export const Page = ({}: Props) => {
    return (
        <PageContainer>
            <RenderRel>{examples1.conR}</RenderRel>
        </PageContainer>
    );
};
