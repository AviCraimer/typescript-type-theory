import {
    Relation,
    SpecificComp,
    opCheck,
    opSymToName,
} from "../../logic/syntaxTree";
import {
    SupportedOpType,
    getRelComponent,
    getSupportedOpType,
} from "./dispatch";

type Props = {
    children: Relation;
};

const RenderRel = ({ children }: Props) => {
    if (opCheck.atom(children)) {
        const Component = getRelComponent("atom");

        return <Component>{children}</Component>;
    }

    const type = getSupportedOpType(children.operation);

    if (type) {
        const Component = getRelComponent(type);

        // We know that children has the correct type for the component because we looked up the component from the children, but TS can't infer this, so we use any here.
        return <Component>{children as any}</Component>;
    } else {
        console.log("\nBad render below:");
        console.error(children);
        throw new Error("attempted render of non supported type ");
    }
};
