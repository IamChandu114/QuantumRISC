`timescale 1ns / 1ps

module if_id_tb;

logic clk;
logic reset;
logic enable;
logic flush;

logic [31:0] pc_in;
logic [31:0] instruction_in;

logic [31:0] pc_out;
logic [31:0] instruction_out;

if_id dut(

    .clk(clk),
    .reset(reset),
    .enable(enable),
    .flush(flush),

    .pc_in(pc_in),
    .instruction_in(instruction_in),

    .pc_out(pc_out),
    .instruction_out(instruction_out)

);

initial begin
    clk = 0;
    forever #5 clk = ~clk;
end

initial begin

    reset = 1;
    enable = 1;
    flush = 0;

    pc_in = 0;
    instruction_in = 32'h00000013;

    #15;

    reset = 0;

    pc_in = 32'h00000004;
    instruction_in = 32'h00A00093;

    #10;

    $display("PC=%h Instruction=%h",
             pc_out,
             instruction_out);

    flush = 1;

    #10;

    $display("After Flush -> PC=%h Instruction=%h",
             pc_out,
             instruction_out);

    $finish;

end

endmodule