import warnings
from typing import Any

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import BaseTool, ToolException
from pydantic.v1 import BaseModel

from langflow.base.flow_processing.utils import build_data_from_result_data, format_flow_output_data
from langflow.graph.graph.base import Graph
from langflow.graph.vertex.base import Vertex
from langflow.helpers.flow import build_schema_from_inputs, get_arg_names, get_flow_inputs, run_flow
from langflow.utils.async_helpers import run_until_complete


class FlowTool(BaseTool):
    name: str
    description: str
    graph: Graph | None = None
    flow_id: str | None = None
    user_id: str | None = None
    inputs: list["Vertex"] = []
    get_final_results_only: bool = True

    @property
    def args(self) -> dict:
        schema = self.get_input_schema()
        return schema.schema()["properties"]

    def get_input_schema(self, config: RunnableConfig | None = None) -> type[BaseModel]:
        """The tool's input schema."""
        if self.args_schema is not None:
            return self.args_schema
        elif self.graph is not None:
            return build_schema_from_inputs(self.name, get_flow_inputs(self.graph))
        else:
            raise ToolException("No input schema available.")

    def _run(
        self,
        *args: Any,
        **kwargs: Any,
    ) -> str:
        """Use the tool."""
        args_names = get_arg_names(self.inputs)
        if len(args_names) == len(args):
            kwargs = {arg["arg_name"]: arg_value for arg, arg_value in zip(args_names, args)}
        elif len(args_names) != len(args) and len(args) != 0:
            raise ToolException(
                "Number of arguments does not match the number of inputs. Pass keyword arguments instead."
            )
        tweaks = {arg["component_name"]: kwargs[arg["arg_name"]] for arg in args_names}

        run_outputs = run_until_complete(
            run_flow(
                tweaks={key: {"input_value": value} for key, value in tweaks.items()},
                flow_id=self.flow_id,
                user_id=self.user_id,
            )
        )
        if not run_outputs:
            return "No output"
        run_output = run_outputs[0]

        data = []
        if run_output is not None:
            for output in run_output.outputs:
                if output:
                    data.extend(build_data_from_result_data(output, get_final_results_only=self.get_final_results_only))
        return format_flow_output_data(data)

    def validate_inputs(self, args_names: list[dict[str, str]], args: Any, kwargs: Any):
        """Validate the inputs."""

        if len(args) > 0 and len(args) != len(args_names):
            raise ToolException(
                "Number of positional arguments does not match the number of inputs. Pass keyword arguments instead."
            )

        if len(args) == len(args_names):
            kwargs = {arg_name["arg_name"]: arg_value for arg_name, arg_value in zip(args_names, args)}

        missing_args = [arg["arg_name"] for arg in args_names if arg["arg_name"] not in kwargs]
        if missing_args:
            raise ToolException(f"Missing required arguments: {', '.join(missing_args)}")

        return kwargs

    def build_tweaks_dict(self, args, kwargs):
        args_names = get_arg_names(self.inputs)
        kwargs = self.validate_inputs(args_names=args_names, args=args, kwargs=kwargs)
        tweaks = {arg["component_name"]: kwargs[arg["arg_name"]] for arg in args_names}
        return tweaks

    async def _arun(
        self,
        *args: Any,
        **kwargs: Any,
    ) -> str:
        """Use the tool asynchronously."""
        tweaks = self.build_tweaks_dict(args, kwargs)
        try:
            run_id = self.graph.run_id if self.graph else None
        except Exception as e:
            warnings.warn(f"Failed to set run_id: {e}")
            run_id = None
        run_outputs = await run_flow(
            tweaks={key: {"input_value": value} for key, value in tweaks.items()},
            flow_id=self.flow_id,
            user_id=self.user_id,
            run_id=run_id,
        )
        if not run_outputs:
            return "No output"
        run_output = run_outputs[0]

        data = []
        if run_output is not None:
            for output in run_output.outputs:
                if output:
                    data.extend(build_data_from_result_data(output, get_final_results_only=self.get_final_results_only))
        return format_flow_output_data(data)